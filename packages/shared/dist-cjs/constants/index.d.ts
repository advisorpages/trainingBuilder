export declare const APP_CONFIG: {
    readonly NAME: "Leadership Training App";
    readonly VERSION: "1.0.0";
    readonly DESCRIPTION: "Mobile-first platform for creating and promoting training sessions";
};
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly STATUS: "/auth/status";
    };
    readonly USERS: {
        readonly BASE: "/users";
        readonly STATUS: "/users/status";
        readonly PROFILE: "/users/profile";
    };
    readonly SESSIONS: {
        readonly BASE: "/sessions";
        readonly STATUS: "/sessions/status";
        readonly PUBLIC: "/sessions/public";
        readonly ADMIN: "/admin/sessions";
    };
    readonly LOCATIONS: "/admin/locations";
    readonly TRAINERS: "/admin/trainers";
    readonly TOPICS: "/admin/topics";
    readonly AUDIENCES: "/admin/audiences";
    readonly TONES: "/admin/tones";
    readonly CATEGORIES: "/admin/categories";
    readonly SETTINGS: "/admin/settings";
    readonly ANALYTICS: "/admin/analytics";
    readonly AI: "/ai";
    readonly INCENTIVES: "/incentives";
    readonly HEALTH: "/health";
};
export declare const USER_ROLES: {
    readonly BROKER: "Broker";
    readonly CONTENT_DEVELOPER: "Content Developer";
    readonly TRAINER: "Trainer";
};
export declare const SESSION_STATUSES: {
    readonly DRAFT: "draft";
    readonly PUBLISHED: "published";
    readonly COMPLETED: "completed";
    readonly CANCELLED: "cancelled";
};
export declare const VALIDATION: {
    readonly EMAIL: {
        readonly MIN_LENGTH: 3;
        readonly MAX_LENGTH: 255;
        readonly REGEX: RegExp;
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly MAX_LENGTH: 100;
    };
    readonly SESSION: {
        readonly TITLE_MAX_LENGTH: 255;
        readonly DESCRIPTION_MAX_LENGTH: 2000;
        readonly MIN_DURATION_MINUTES: 15;
        readonly MAX_DURATION_MINUTES: 480;
    };
    readonly GENERAL: {
        readonly NAME_MAX_LENGTH: 255;
        readonly DESCRIPTION_MAX_LENGTH: 2000;
    };
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const ENV_KEYS: {
    readonly NODE_ENV: "NODE_ENV";
    readonly PORT: "PORT";
    readonly DATABASE_HOST: "DATABASE_HOST";
    readonly DATABASE_PORT: "DATABASE_PORT";
    readonly DATABASE_NAME: "DATABASE_NAME";
    readonly DATABASE_USER: "DATABASE_USER";
    readonly DATABASE_PASSWORD: "DATABASE_PASSWORD";
    readonly JWT_SECRET: "JWT_SECRET";
    readonly VITE_API_URL: "VITE_API_URL";
};
export declare const DEFAULTS: {
    readonly SESSION_DURATION_MINUTES: 120;
    readonly MAX_REGISTRATIONS_PER_SESSION: 50;
    readonly LOCATION_CAPACITY: 30;
};
export declare const TONE_DEFAULTS: {
    readonly INSTRUCTIONAL: "Instructional";
    readonly MARKETING: "Conversational";
};
