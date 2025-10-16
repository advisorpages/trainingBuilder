"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncentiveStatus = exports.ToneUsageType = exports.ToneSentenceStructure = exports.ToneEnergyLevel = exports.ToneStyle = exports.AudienceVocabularyLevel = exports.AudienceCommunicationStyle = exports.AudienceExperienceLevel = exports.SettingDataType = exports.MeetingPlatform = exports.LocationType = exports.SessionStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["BROKER"] = "Broker";
    UserRole["CONTENT_DEVELOPER"] = "Content Developer";
    UserRole["TRAINER"] = "Trainer";
})(UserRole || (exports.UserRole = UserRole = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["DRAFT"] = "draft";
    SessionStatus["REVIEW"] = "review";
    SessionStatus["READY"] = "ready";
    SessionStatus["PUBLISHED"] = "published";
    SessionStatus["RETIRED"] = "retired";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["CANCELLED"] = "cancelled";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
// Resource types
var LocationType;
(function (LocationType) {
    LocationType["PHYSICAL"] = "physical";
    LocationType["VIRTUAL"] = "virtual";
    LocationType["HYBRID"] = "hybrid";
})(LocationType || (exports.LocationType = LocationType = {}));
var MeetingPlatform;
(function (MeetingPlatform) {
    MeetingPlatform["ZOOM"] = "zoom";
    MeetingPlatform["MICROSOFT_TEAMS"] = "microsoft_teams";
    MeetingPlatform["GOOGLE_MEET"] = "google_meet";
    MeetingPlatform["OTHER"] = "other";
})(MeetingPlatform || (exports.MeetingPlatform = MeetingPlatform = {}));
var SettingDataType;
(function (SettingDataType) {
    SettingDataType["STRING"] = "string";
    SettingDataType["NUMBER"] = "number";
    SettingDataType["BOOLEAN"] = "boolean";
    SettingDataType["JSON"] = "json";
})(SettingDataType || (exports.SettingDataType = SettingDataType = {}));
// Attribute types
var AudienceExperienceLevel;
(function (AudienceExperienceLevel) {
    AudienceExperienceLevel["BEGINNER"] = "beginner";
    AudienceExperienceLevel["INTERMEDIATE"] = "intermediate";
    AudienceExperienceLevel["ADVANCED"] = "advanced";
    AudienceExperienceLevel["MIXED"] = "mixed";
})(AudienceExperienceLevel || (exports.AudienceExperienceLevel = AudienceExperienceLevel = {}));
var AudienceCommunicationStyle;
(function (AudienceCommunicationStyle) {
    AudienceCommunicationStyle["FORMAL"] = "formal";
    AudienceCommunicationStyle["CONVERSATIONAL"] = "conversational";
    AudienceCommunicationStyle["TECHNICAL"] = "technical";
    AudienceCommunicationStyle["SIMPLIFIED"] = "simplified";
})(AudienceCommunicationStyle || (exports.AudienceCommunicationStyle = AudienceCommunicationStyle = {}));
var AudienceVocabularyLevel;
(function (AudienceVocabularyLevel) {
    AudienceVocabularyLevel["BASIC"] = "basic";
    AudienceVocabularyLevel["PROFESSIONAL"] = "professional";
    AudienceVocabularyLevel["EXPERT"] = "expert";
    AudienceVocabularyLevel["INDUSTRY_SPECIFIC"] = "industry_specific";
})(AudienceVocabularyLevel || (exports.AudienceVocabularyLevel = AudienceVocabularyLevel = {}));
var ToneStyle;
(function (ToneStyle) {
    ToneStyle["PROFESSIONAL"] = "professional";
    ToneStyle["CASUAL"] = "casual";
    ToneStyle["MOTIVATIONAL"] = "motivational";
    ToneStyle["AUTHORITATIVE"] = "authoritative";
    ToneStyle["EMPOWERING"] = "empowering";
    ToneStyle["COLLABORATIVE"] = "collaborative";
    ToneStyle["DIRECTIVE"] = "directive";
})(ToneStyle || (exports.ToneStyle = ToneStyle = {}));
var ToneEnergyLevel;
(function (ToneEnergyLevel) {
    ToneEnergyLevel["CALM"] = "calm";
    ToneEnergyLevel["MODERATE"] = "moderate";
    ToneEnergyLevel["ENERGETIC"] = "energetic";
    ToneEnergyLevel["PASSIONATE"] = "passionate";
})(ToneEnergyLevel || (exports.ToneEnergyLevel = ToneEnergyLevel = {}));
var ToneSentenceStructure;
(function (ToneSentenceStructure) {
    ToneSentenceStructure["SIMPLE"] = "simple";
    ToneSentenceStructure["MODERATE"] = "moderate";
    ToneSentenceStructure["COMPLEX"] = "complex";
    ToneSentenceStructure["VARIED"] = "varied";
})(ToneSentenceStructure || (exports.ToneSentenceStructure = ToneSentenceStructure = {}));
var ToneUsageType;
(function (ToneUsageType) {
    ToneUsageType["INSTRUCTIONAL"] = "instructional";
    ToneUsageType["MARKETING"] = "marketing";
    ToneUsageType["BOTH"] = "both";
})(ToneUsageType || (exports.ToneUsageType = ToneUsageType = {}));
var IncentiveStatus;
(function (IncentiveStatus) {
    IncentiveStatus["DRAFT"] = "draft";
    IncentiveStatus["PUBLISHED"] = "published";
    IncentiveStatus["EXPIRED"] = "expired";
    IncentiveStatus["CANCELLED"] = "cancelled";
})(IncentiveStatus || (exports.IncentiveStatus = IncentiveStatus = {}));
