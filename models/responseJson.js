
class ResponseJson {
    constructor(status, data) {
        this.status = status;
        this.data = data;
    }

    // in case of unauthorized access, return a 403 status code
    static noLogin() {
        return new ResponseJson("no_login", "You are not logged in!");
    }

    // in case of sql error, return a 500 status code
    static sqlError() {
        return new ResponseJson("sql_error", "Database error, try again later!");
    }

    // no parameter
    static noParam()
    {
        return new ResponseJson("no_param", "No parameter provided!");
    }

    static noParamMsg(msg)
    {
        return new ResponseJson("no_param", msg);
    }

    // in case of success, return a 200 status code
    static ok(data) {
        return new ResponseJson("ok", data);
    }

    static err(msg)
    {
        return new ResponseJson("error", msg);
    }


}

module.exports = ResponseJson;