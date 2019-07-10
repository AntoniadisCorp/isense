"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_useragent_1 = __importDefault(require("express-useragent"));
var util_1 = require("util");
var bCrypt = __importStar(require("bCrypt"));
var GBRoutines = /** @class */ (function () {
    function GBRoutines() {
    }
    // private version: string
    // constructor(version: string) {
    //     this.version = version
    // }
    // public GBRoutines(): void {}
    GBRoutines.prototype.generateUUID = function (version) {
        switch (version) {
            case 'timestamp':
                var uuidv1 = require('uuid/v1');
                return uuidv1();
                break;
            case 'random':
                var uuidv4 = require('uuid/v5');
                return uuidv4();
                break;
            default:
                var uuidv5 = require('uuid/v5');
                // ... using predefined URL namespace (for, well, URLs) 
                uuidv5('mail.technicalprb.com', uuidv5['URL']);
                return uuidv5['URL'];
                break;
        }
    };
    GBRoutines.prototype.getUserSession = function (res, machineId) {
        var source = res.header('user-agent').toString(), us = express_useragent_1.default.parse(source || '');
        return {
            agent: {
                isMobile: us ? us.isMobile : '',
                isBot: us ? us.isBot : '',
                browser: us ? us.browser : '',
                version: us ? us.version : '',
                os: us ? us.os : '',
                platform: us ? us.platform : '',
                source: source || '',
            },
            referrer: res.header('referrer') || '',
            ip: res.header('x-forwarded-for') || res.connection.remoteAddress,
            device: {
                OsUUID: machineId,
                type: '' // res.device.type.toUpperCase()
            }
        };
    };
    /* -------------------------- passport Strategy -------------------------- */
    // Compares hashed passwords using bCrypt
    GBRoutines.prototype.isValidPassword = function (user, password) {
        return bCrypt.compareSync(password, user.password);
    };
    // Generates hash using bCrypt
    GBRoutines.prototype.createHash = function (password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10));
    };
    GBRoutines.prototype.Variablevalid = function (s) {
        return s && (util_1.isString(s) || util_1.isArray(s)) && s.length > 0 ? s : null;
    };
    return GBRoutines;
}());
exports.GBRoutines = GBRoutines;
