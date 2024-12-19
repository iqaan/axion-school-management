module.exports = {
    createClassroom: [ // New schema for creating a classroom
        {
            model: 'name',
            required: true
        },
        {
            model: 'description',
            required: false
        },
        {
            model: 'capacity',
            required: true
        }
    ],
    updateClassroom: [
        {
            model: 'name',
            required: false
        },
        {
            model: 'description',
            required: false
        },
        {
            model: 'capacity',
            required: false
        }
    ],
    deleteClassroom: [
        {
            model: 'id',
            required: true
        }
    ]
};
