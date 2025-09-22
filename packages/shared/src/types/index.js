"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncentiveStatus = exports.SettingDataType = exports.SessionStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["BROKER"] = "Broker";
    UserRole["CONTENT_DEVELOPER"] = "Content Developer";
    UserRole["TRAINER"] = "Trainer";
})(UserRole || (exports.UserRole = UserRole = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["DRAFT"] = "draft";
    SessionStatus["PUBLISHED"] = "published";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["CANCELLED"] = "cancelled";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var SettingDataType;
(function (SettingDataType) {
    SettingDataType["STRING"] = "string";
    SettingDataType["NUMBER"] = "number";
    SettingDataType["BOOLEAN"] = "boolean";
    SettingDataType["JSON"] = "json";
})(SettingDataType || (exports.SettingDataType = SettingDataType = {}));
var IncentiveStatus;
(function (IncentiveStatus) {
    IncentiveStatus["DRAFT"] = "draft";
    IncentiveStatus["PUBLISHED"] = "published";
    IncentiveStatus["EXPIRED"] = "expired";
    IncentiveStatus["CANCELLED"] = "cancelled";
})(IncentiveStatus || (exports.IncentiveStatus = IncentiveStatus = {}));
//# sourceMappingURL=index.js.map