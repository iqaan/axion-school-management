import mongoose from 'mongoose';
import User from './managers/entities/user/User.mongoModel.js';
import bcrypt from "bcrypt";

const MONGO_URI = process.env.MONGO_URI;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const salt = await bcrypt.genSalt(10);
const superPasswordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);

const superAdmin = new User({
    username: 'superadmin',
    email: SUPER_ADMIN_EMAIL,
    password: superPasswordHash, // please change this to a secure password
    roles: {
        isSuper: true,
    },
});

try {
    const user = await superAdmin.save();
    console.log('Super admin user created:', user);
} catch (err) {
    console.error(err);
}

mongoose.disconnect();