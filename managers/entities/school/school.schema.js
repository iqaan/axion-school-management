module.exports = {
    createSchool: [
        {
            model: 'name',
            required: true
        },
        {
            model: 'address',
            required: true
        }
    ],
    updateSchool: [
        {
            model: 'id',
            required: true
        },
        {
            model: 'name',
            required: false
        },
        {
            model: 'address',
            required: false
        }
    ],
    deleteSchool: [
        {
            model: 'id',
            required: true
        }
    ]
};
