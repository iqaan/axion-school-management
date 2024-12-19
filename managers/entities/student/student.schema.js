module.exports = {
    createStudent: [
        {
            model: 'rollNumber',
            required: true
        },
        {
            model: 'username',
            required: true
        },
        {
            model: 'schoolId',
            required: true,
        }
    ],
    updateStudent: [
        {
            model: 'id',
            required: true
        }
    ],
    deleteStudent: [
        {
            model: 'id',
            required: true
        }
    ],
    getStudent: [
        {
            model: 'id',
            required: true
        }
    ],
    listAllStudents: [
        {
            model: 'schoolId',
            required: true
        },
        {
            model: 'classroomId',
            required: false
        }
    ],
    enroll: [
        {
            model: 'id',
            required: true
        },
        {
            model: 'classroomId',
            required: true
        }
    ],
    transfer: [
        {
            model: 'id',
            required: true
        },
        {
            model:'schoolId',
            required: true
        }
    ],
    deroll: [
        {
            model: 'id',
            required: true
        },
        {
            model: 'classroomId',
            required: true
        }
    ]
};

