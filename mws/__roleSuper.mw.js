module.exports = ({meta, config, managers}) => {
    return ({req, res, next, results}) => {
        const roles = results?.__longToken?.roles;
        if (!roles?.isSuper) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 401,
                errors: ['Unauthorized']
            });
        }

        next(roles);
    }
}
