const {getSparseObject} = require("../../../libs/utils");
module.exports = class Student {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels} = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.studentsCollection = "Student";
        this.userCollection = "User";
        this.classroomCollection = "Classroom";
        this.schoolCollection = "School";
        this.httpExposed = [
            'createStudent',
            'get=getStudent',
            'patch=updateStudent',
            'delete=deleteStudent',
            'get=listAllStudents',
            'patch=enroll',
            'patch=deroll',
            'patch=transfer'
        ];

        this.StudentEntity = this.mongomodels[this.studentsCollection];
        this.UserEntity = this.mongomodels[this.userCollection];
        this.ClassroomEntity = this.mongomodels[this.classroomCollection];
        this.SchoolEntity = this.mongomodels[this.schoolCollection];

        this.DEFAULT_LIMIT = 10;
    }

    async createStudent({rollNumber, username, schoolId, __longToken}) {
        // Data validation
        const errors = await this.validators.student.createStudent({
            rollNumber,
            username,
            schoolId
        });
        if (errors) return {ok: false, errors};

        const schoolAdmin = this.tokenManager.hasSchoolAccess(schoolId, __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        // Check if user exists
        const user = await this.UserEntity.findOne({username});
        if (!user) {
            return {ok: false, code: 404, errors: ['User doesn\'t exist']};
        }

        const existingStudent = await this.StudentEntity.findOne({user});
        if (existingStudent) {
            return {ok: false, code: 409, errors: ['User already has a student']};
        }

        // Creation Logic
        try {
            const createdStudent = new this.StudentEntity({
                rollNumber,
                user: user._id,
                school: schoolId,
            });

            await createdStudent.save();

            return {
                student: createdStudent
            };
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to create student']};
        }
    }

    async getStudent({id, __longToken}) {
        // Data validation
        const errors = await this.validators.student.getStudent({id});
        if (errors) return {ok: false, errors};

        // Fetching Logic
        try {
            const fetchedStudent = await this.StudentEntity.findById(id);
            if (!fetchedStudent) {
                return {ok: false, code: 404, errors: ['Student doesn\'t exist']};
            }

            // Allow school admins and students to access their own student info
            if (__longToken.userId !== fetchedStudent.user.toString()) {
                const schoolAdmin = this.tokenManager.hasSchoolAccess(fetchedStudent.school.toString(), __longToken);
                if (!schoolAdmin.access) {
                    return schoolAdmin.errorResponse;
                }
            }

            return {
                student: fetchedStudent
            };
        } catch (error) {
            return {ok: false, code: 500, errors: ['Failed to fetch student']};
        }
    }

    async updateStudent({id, rollNumber, __longToken}) {
        const body = {rollNumber};
        // Data validation
        const errors = await this.validators.student.updateStudent({id, ...body});
        if (errors) return {ok: false, errors};

        // Check if student exists
        const existingStudent = await this.StudentEntity.findById(id).exec();
        if (!existingStudent) {
            return {ok: false, code: 404, errors: ['Student doesn\'t exist']};
        }

        const schoolAdmin = this.tokenManager.hasSchoolAccess(existingStudent.school.toString(), __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        // Update Logic
        try {
            const update = getSparseObject(body);
            Object.assign(existingStudent, update);
            await existingStudent.save();
            return {
                student: existingStudent
            };
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to update student']};
        }
    }

    async deleteStudent({id, __longToken}) {
        // Data validation
        const errors = await this.validators.student.deleteStudent({id});
        if (errors) return {ok: false, errors};

        const existingStudent = await this.StudentEntity.findById(id);
        if (!existingStudent) {
            return {ok: false, code: 404, errors: ['Student doesn\'t exist']};
        }

        const schoolAdmin = this.tokenManager.hasSchoolAccess(existingStudent.school.toString(), __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        // Deletion Logic
        try {
            await this.StudentEntity.findByIdAndDelete(id);
            return {deleted: true};
        } catch (error) {
            return {ok: false, code: 500, errors: ['Failed to delete student']};
        }
    }

    async listAllStudents({schoolId, classroomId, __query, __longToken}) {
        // Data validation
        const filterOffset = parseInt(__query?.filter?.offset || 0);
        const filterLimit = parseInt(__query?.filter?.limit || this.DEFAULT_LIMIT);

        const errors = await this.validators.student.listAllStudents({schoolId, classroomId});
        if (errors) return {ok: false, errors};

        const schoolAdmin = this.tokenManager.hasSchoolAccess(schoolId, __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        try {
            const query = { school: schoolId }
            if (classroomId) {
                query.classrooms = {$elemMatch: {"$eq": classroomId}}
            }
            const fetchedStudents = await this.StudentEntity.find(query).skip(filterOffset).limit(filterLimit);

            return {
                students: fetchedStudents
            };
        } catch (error) {
            return {ok: false, code: 500, errors: ['Failed to fetch students']};
        }
    }

    async enroll({id, classroomId, __longToken}) {
        // Data validation
        const errors = await this.validators.student.enroll({id, classroomId});
        if (errors) return {ok: false, errors};

        const existingStudent = await this.StudentEntity.findById(id);
        if (!existingStudent) {
            return {ok: false, code: 404, errors: ['Student doesn\'t exist']};
        }

        const classroom = await this.ClassroomEntity.findById(classroomId);
        if (!classroom) {
            return {ok: false, code: 404, errors: ['Classroom not found']};
        }

        if (existingStudent.classrooms.includes(classroomId)) {
            return { ok: false, code: 422, errors: ['Student already enrolled in class']}
        }

        // Check if school is the same
        if (existingStudent.school.toString() !== classroom.school.toString()) {
            return {ok: false, code: 422, errors: ['Student and classroom are from different schools']};
        }

        // check if classroom capacity is exhausted
        if (classroom.capacity <= existingStudent.classrooms.length) {
            return { ok: false, code: 422, errors: ['Classroom capacity is exhausted'] };
        }

        const schoolAdmin = this.tokenManager.hasSchoolAccess(classroom.school.toString(), __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        // Enroll Logic
        try {
            const updated = await existingStudent.updateOne({$push: {classrooms: classroomId}});
            return {
                updated
            };
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to enroll student']};
        }
    }

    async deroll({id, classroomId, __longToken}) {
        // Data validation
        const errors = await this.validators.student.deroll({id, classroomId});
        if (errors) return {ok: false, errors};

        const existingStudent = await this.StudentEntity.findById(id);
        if (!existingStudent) {
            return {ok: false, code: 404, errors: ['Student doesn\'t exist']};
        }

        // Check if student is enrolled in class
        if (!existingStudent.classrooms.includes(classroomId)) {
            return {ok: false, code: 409, errors: ['Student not enrolled in class']}
        }

        const schoolAdmin = this.tokenManager.hasSchoolAccess(existingStudent.school.toString(), __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        // Deroll Logic
        try {
            const updated = await existingStudent.updateOne({$pull: {classrooms: classroomId}});
            return {
                updated
            };
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to deroll student']};
        }
    }

    async transfer({id, schoolId, __longToken}) {
        // Data validation
        const errors = await this.validators.student.transfer({id, schoolId});
        if (errors) return {ok: false, errors};

        // Check if student and new school exist
        const existingStudent = await this.StudentEntity.findById(id);
        if (!existingStudent) {
            return {ok: false, code: 404, errors: ['Student doesn\'t exist']};
        }

        const newSchool = await this.SchoolEntity.findById(schoolId);
        if (!newSchool) {
            return {ok: false, code: 404, errors: ['New school doesn\'t exist']};
        }

        // Check if school is the same
        if (existingStudent.school.toString() === schoolId) {
            return {ok: false, code: 409, errors: ['Student and new school are from the same school']};
        }

        const oldSchoolAdmin = this.tokenManager.hasSchoolAccess(existingStudent.school.toString(), __longToken);
        const newSchoolAdmin = this.tokenManager.hasSchoolAccess(schoolId, __longToken);
        if (!oldSchoolAdmin.access || !newSchoolAdmin.access) {
            return oldSchoolAdmin.errorResponse;
        }

        // Transfer Logic
        try {
            await existingStudent.updateOne({$pull: {classrooms: existingStudent.classrooms}});
            const update = getSparseObject({school: schoolId});
            Object.assign(existingStudent, update);
            const updated = await existingStudent.save();
            return {
                updated
            };
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to transfer student']};
        }
    }

}
