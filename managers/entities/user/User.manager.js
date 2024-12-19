const bcrypt = require("bcrypt");
module.exports = class User {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels} = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.usersCollection = "User";
        this.userExposed = ['createUser'];
        this.httpExposed = ['createUser', 'login', 'patch=updateRoles'];

        this.UserEntity = this.mongomodels[this.usersCollection];
    }

    async createUser({username, email, password}) {

        // Data validation
        let errors = await this.validators.user.createUser({username, email, password});
        if (errors) return {ok: false, errors};

        // check if the user (either username, or email) already exists
        let existingUser = await this.UserEntity.findOne({$or: [{username}, {email}]});
        if (existingUser) {
            return {ok: false, errors: ['User already exists']};
        }

        // Creation Logic
        const hashedPassword = await this._hashPassword(password);
        const createdUser = new this.UserEntity({username, email, password: hashedPassword});

        try {
            await createdUser.save();
        } catch (error) {
            console.error('Error creating user:', error);
            return {ok: false, errors: ['Failed to create user']};
        }

        let longToken = this.tokenManager.genLongToken({
            userId: createdUser._id,
            userKey: createdUser.key,
            roles: createdUser.roles
        });

        const user = await this.UserEntity.findOne(createdUser._id);

        return {
            user,
            longToken
        };
    }

    async login({username, password}) {
        const authUser = await this.UserEntity.findOne({username}).select('+password');

        // Data validation
        let errors = await this.validators.user.login({username, password});
        if (errors) return {ok: false, errors};

        const passwordsMatch = await this._comparePassword(password, authUser.password);
        if (!passwordsMatch) {
            return {ok: false, errors: ['Incorrect username or password']};
        }

        const loginToken = this.tokenManager.genLongToken({userId: authUser._id, userKey: authUser.key, roles: authUser.roles});

        const user = await this.UserEntity.findOne({username});

        return {
            user,
            loginToken
        }
    }

    async updateRoles({id, roles, __longToken, __roleSuper}) {
        if (__longToken.userId === id) {
            return {ok: false, errors: ['Cannot update self permissions']}
        }

        // Data validation
        let errors = await this.validators.user.updateRoles({id, roles});
        if (errors) return {ok: false, errors};

        const user = await this.UserEntity.findById(id);
        if (!user) {
            return {ok: false, code: 404, errors: ['User not found']};
        }

        const rolesObject = JSON.parse(roles);

        try {
            user.roles = rolesObject;
            await user.save();
            return { user };
        }
        catch (error) {
            return {ok: false, errors: ['Failed to update roles']}
        }
    }

    async _hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    async _comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

}
