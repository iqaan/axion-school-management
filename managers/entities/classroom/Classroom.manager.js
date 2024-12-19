const {getSparseObject} = require("../../../libs/utils");
const {createClassroom} = require("./classroom.schema");
module.exports = class Classroom {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels} = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.classroomsCollection = "Classroom";
        this.httpExposed = ['createClassroom', 'get=getClassroom', 'patch=updateClassroom', 'delete=deleteClassroom', 'get=listAllClassrooms'];

        this.ClassroomEntity = this.mongomodels[this.classroomsCollection];

        this.DEFAULT_LIMIT = 10;
    }

    async createClassroom({schoolId, name, description, capacity, __longToken}) {
        const classroomData = {name, description, capacity};
        classroomData.capacity = parseInt(capacity);

        // Data validation
        let errors = await this.validators.classroom.createClassroom(classroomData);
        if (errors) return {ok: false, errors};

        const schoolAdmin = await this.tokenManager.hasSchoolAccess(schoolId, __longToken);
        if (!schoolAdmin.access) {
            console.log(`School Admin: ${JSON.stringify(__longToken.roles)}`)
            return schoolAdmin.errorResponse;
        }

        try {
            let createdClassroom = new this.ClassroomEntity(classroomData);
            createdClassroom.school = schoolId;
            await createdClassroom.save();

            return {
                classroom: createdClassroom,
            };
        } catch (error) {
            console.log(error);
            return {ok: false, errors: ['Failed to create classroom']};
        }
    }

    async getClassroom({id, __longToken}) {
        const classroom = await this.ClassroomEntity.findById(id);
        if (!classroom) return {ok: false, errors: ['Classroom not found']};

        const schoolAdmin = await this.tokenManager.hasSchoolAccess(classroom.school.toString(), __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        return {classroom};
    }

    async updateClassroom({id, name, description, capacity, __longToken}) {
        const body = {name, description, capacity};
        body.capacity = parseInt(capacity);

        // Data validation
        let errors = await this.validators.classroom.updateClassroom({id, ...body});
        if (errors) return {ok: false, errors};

        let classroom = await this.ClassroomEntity.findById(id);
        if (!classroom) return { ok: false, code: 404, errors: ['Classroom not found'] };

        const schoolAdmin = await this.tokenManager.hasSchoolAccess(classroom.school.toString(), __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        try {
            const update = getSparseObject(body);
            Object.assign(classroom, update);
            await classroom.save();
            return { classroom };
        }
        catch (error) {
            return { ok: false, code: 409, errors: ['Failed to update classroom'] };
        }
    }

    async deleteClassroom({id, __longToken}) {
        const errors = await this.validators.classroom.deleteClassroom({id});
        if (errors) return { ok: false, errors };

        const classroom = await this.ClassroomEntity.findById(id);
        if (!classroom) return { ok: false, code: 404, errors: ['Classroom not found'] };

        const schoolAdmin = await this.tokenManager.hasSchoolAccess(classroom.school.toString(), __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        try {
            await this.ClassroomEntity.findByIdAndDelete(id);
            return { deleted: true };
        } catch (error) {
            return { ok: false, code: 409, errors: ['Failed to delete classroom'] };
        }
    }

    async listAllClassrooms({schoolId, __query, __longToken}) {
        const schoolAdmin = await this.tokenManager.hasSchoolAccess(schoolId, __longToken);
        if (!schoolAdmin.access) {
            return schoolAdmin.errorResponse;
        }

        const filterOffset = parseInt(__query?.filter?.offset) || 0;
        const filterLimit = parseInt(__query?.filter?.limit) || this.DEFAULT_LIMIT;

        const classrooms = await this.ClassroomEntity.find({ school: schoolId })
            .skip(filterOffset)
            .limit(filterLimit);

        return {
            classrooms
        };
    }
}

