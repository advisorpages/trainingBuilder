export interface User {
    id: string;
    email: string;
    roleId: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    role: Role;
    authoredSessions?: Session[];
    authoredIncentives?: Incentive[];
}
export interface Role {
    id: number;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    BROKER = "Broker",
    CONTENT_DEVELOPER = "Content Developer",
    TRAINER = "Trainer"
}
export interface Session {
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    status: SessionStatus;
    qrCodeUrl?: string;
    authorId: string;
    locationId?: number;
    trainerId?: number;
    audienceId?: number;
    toneId?: number;
    categoryId?: number;
    maxRegistrations: number;
    aiPrompt?: string;
    aiGeneratedContent?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: User;
    location?: Location;
    trainer?: Trainer;
    audience?: Audience;
    tone?: Tone;
    category?: Category;
    topics: Topic[];
}
export declare enum SessionStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface Location {
    id: number;
    name: string;
    address?: string;
    capacity?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sessions?: Session[];
}
export interface Trainer {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
    email?: string;
    bio?: string;
    expertise?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sessions?: Session[];
}
export declare enum SettingDataType {
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean",
    JSON = "json"
}
export interface SystemSetting {
    key: string;
    value: string;
    description?: string;
    category?: string;
    dataType: SettingDataType;
    defaultValue?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Topic {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sessions?: Session[];
}
export interface Audience {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sessions?: Session[];
}
export interface Tone {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sessions?: Session[];
}
export interface Category {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sessions?: Session[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T = any> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
}
export interface AuthContext {
    user: User | null;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
}
export interface Registration {
    id: string;
    sessionId: string;
    name: string;
    email: string;
    referredBy?: string;
    createdAt: Date;
    updatedAt: Date;
    session?: Session;
}
export interface RegistrationRequest {
    name: string;
    email: string;
    referredBy?: string;
}
export interface Incentive {
    id: string;
    title: string;
    description?: string;
    rules?: string;
    startDate: Date;
    endDate: Date;
    status: IncentiveStatus;
    authorId: string;
    aiGeneratedContent?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: User;
}
export declare enum IncentiveStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
