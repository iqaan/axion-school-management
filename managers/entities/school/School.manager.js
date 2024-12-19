const {getSparseObject} = require("../../../libs/utils");
module.exports = class School {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels} = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.schoolCollection = "School";
        this.httpExposed = ['createSchool', 'get=listAllSchools', 'patch=updateSchool', 'delete=deleteSchool', 'get=getSchool'];

        this.SchoolEntity = this.mongomodels[this.schoolCollection];
        this.DEFAULT_LIMIT = 10;
    }

    async createSchool({name, address, __longToken, __roleSuper}) {
        const errors = await this.validators.school.createSchool({name, address});
        if (errors) return {ok: false, errors};
        try {
            const newSchool = new this.SchoolEntity({
                name: name,
                address: address
            });
            await newSchool.save();
            return {school: newSchool};
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to create school']};
        }
    }

    async listAllSchools({__query, __longToken, __roleSuper}) {
        const filterOffset = parseInt(__query?.filter?.offset || 0);
        const filterLimit = parseInt(__query?.filter?.limit || this.DEFAULT_LIMIT);

        const schools = await this.SchoolEntity.find()
            .skip(filterOffset)
            .limit(filterLimit);

        return {schools};
    }

    async updateSchool({id, name, address, __longToken, __roleSuper}) {
        const body = {name, address};
        const errors = await this.validators.school.updateSchool({id, ...body});
        if (errors) return {ok: false, errors};

        let school = await this.SchoolEntity.findById(id);
        if (!school) return {ok: false, code: 404, errors: ['School not found']};

        try {
            const update = getSparseObject(body);
            Object.assign(school, update);
            await school.save();
            return {school};
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to update school']};
        }
    }

    async deleteSchool({id, __longToken, __roleSuper}) {
        const errors = await this.validators.school.deleteSchool({id});
        if (errors) return {ok: false, errors};

        const school = await this.SchoolEntity.findById(id);
        if (!school) return {ok: false, code: 404, errors: ['School not found']};

        try {
            await this.SchoolEntity.findByIdAndDelete(id);
            return {deleted: true};
        } catch (error) {
            return {ok: false, code: 409, errors: ['Failed to delete school']};
        }
    }

    async getSchool({id, __longToken}) {
        if (!id) return {ok: false, code: 400, errors: ['Missing school ID']};

        try {
            const school = await this.SchoolEntity.findById(id);
            if (!school) return {ok: false, code: 404, errors: ['School not found']};

            const schoolAdmin = await this.tokenManager.hasSchoolAccess(id, __longToken);
            if (!schoolAdmin.access) {
                return schoolAdmin.errorResponse;
            }

            return {school};
        } catch (error) {
            console.log(error);
            return {ok: false, code: 500, errors: ['Internal server error']};
        }
    }
}
