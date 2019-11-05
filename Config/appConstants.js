
const SERVER = {
    APP_NAME: 'cema App',
    JWT_SECRET_KEY: 'MaEHqzXzdWrCS6TS',
    THUMB_WIDTH : 50,
    THUMB_HEIGHT : 50,
    ONE_SIGNAL_APP_ID: '14040b3c-c21c-4a05-8f29-bfa737f72d31'
};


const DATABASE = {
    PROFILE_PIC_PREFIX : {
        ORIGINAL : 'Pic_',
        THUMB : 'Thumb_'
    },
    DEVICE_TYPES: {
        IOS: 'IOS',
        ANDROID: 'ANDROID'
    },
    POST_TYPE : {
        NORMAL:'NORMAL',
        SPONSER : 'SPONSER',
        PRIVATE : 'PRIVATE',
    },
    USER_TYPE: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        SELLER: 'SELLER',
        BOTH : 'BOTH'
    },
    MEDIA_TYPE : {
        VIDEO:'VIDEO',
        IMAGE : 'IMAGE',
        TEXT:'TEXT',
        OTHER:'OTHER'
    },
    TYPE : {
      EVENT_WIN :1,
      SIGNUP :2,
    },
    SHARE_ON : {
        FACEBOOK : 0,
        TWITTER :1,
        TEXT_EMAIL :2,
        OTHERS : 3
    },
    NOTIFY_TYPES : {
        POST_MATCH : 1,
        ORDER_CREATED : 2,
        ORDER_COMPLETE : 3,
        ORDER_CANCEL : 4,
        REQUEST_SUBMIT : 5,
        ACCOUNT_APPROVED : 6,
       // POST_ADDED : 4,
    }
};

const STATUS_MSG = {
    ERROR: {
        TOKEN_EXPIRED: {
            statusCode:401,
            customMessage : 'Sorry, your account has been logged in other device! Please login again to continue.',
            type : 'TOKEN_ALREADY_EXPIRED'
        },
        BLOCKED: {
            statusCode:405,
            customMessage : 'This account is blocked by Admin. Please contact support team to activate your account.',
            type : 'BLOCKED'
        },
        DB_ERROR: {
            statusCode:400,
            customMessage : 'DB Error : ',
            type : 'DB_ERROR'
        },
        INVALID_PASSWORD: {
            statusCode:400,
            customMessage : 'Password you have entered does not match.',
            type : 'INVALID_PASSWORD'
        },
        ALREADY_EXIST: {
            statusCode:400,
            customMessage : 'Email address you have entered is already registered with us.',
            type : 'ALREADY_EXIST'
        },
        ACCOUNT_APPROVED: {
            statusCode:400,
            customMessage : 'Your payment accepted account is not activated by admin.Please wait for the activation.If not registered, then go to profile and complete the verify payment request.',
            type : 'ACCOUNT_APPROVED'
        },
        FULLNAME: {
            statusCode:400,
            customMessage : 'Spaces are not allowed in full name.',
            type : 'FULLNAME'
        },
        LINK_EXPIRE: {
            statusCode:400,
            customMessage : 'This link is expired, Kindly resubmit your email to get new link.',
            type : 'ALREADY_EXIST'
        },
        USERNAME_EXIST: {
            statusCode:400,
            customMessage : 'User name you have entered is already taken.',
            type : 'USERNAME_EXIST'
        },
        PHONE_ALREADY_EXIST: {
            statusCode:400,
            customMessage : 'Phone number you have entered is already registered with us.',
            type : 'PHONE_ALREADY_EXIST'
        },
        IMP_ERROR: {
            statusCode:500,
            customMessage : 'Implementation error',
            type : 'IMP_ERROR'
        },
        APP_ERROR: {
            statusCode:400,
            customMessage : 'Application Error',
            type : 'APP_ERROR'
        },
        INVALID_ID: {
            statusCode:400,
            customMessage : 'Invalid Id Provided : ',
            type : 'INVALID_ID'
        },
        DUPLICATE: {
            statusCode:400,
            customMessage : 'Duplicate Entry',
            type : 'DUPLICATE'
        },
        USERNAME_INVALID: {
            statusCode:400,
            customMessage : 'Username you have entered does not match.',
            type : 'USERNAME_INVALID'
        },
        INVALID_EMAIL: {
            statusCode:400,
            customMessage : 'The email address you have entered does not match.',
            type : 'INVALID_EMAIL'
        },
        ALREADY_REPORT: {
            statusCode:400,
            customMessage : 'This post has been already reported.',
            type: 'ALREADY_REPORT',
        },
        INVALID_TOKEN: {
            statusCode:400,
            customMessage : 'The token you have entered does not match.',
            type : 'INVALID_TOKEN'
        },
        SAME_PASSWORD: {
            statusCode:400,
            customMessage : 'New password can\'t be same as Old password.',
            type : 'SAME_PASSWORD'
        },
        INCORRECT_OLD_PASSWORD: {
            statusCode:400,
            customMessage : 'Old password you have entered does not match.',
            type : 'INCORRECT_OLD_PASSWORD'
        },
        NOT_EXIST: {
            statusCode:400,
            customMessage : 'You have not registered yet.',
            type : 'NOT_EXIST'
        },
        NOT_APPROVED: {
            statusCode:400,
            customMessage : 'Your profile is not approved by admin.',
            type : 'NOT_APPROVED'
        },
        CATEGORY_NAME: {
            statusCode:400,
            customMessage : 'Category name you have entered is already exist.',
            type : 'CATEGORY_NAME'
        },
        SUBCATEGORY_NAME: {
            statusCode:400,
            customMessage : 'Sub category name you have entered is already exist.',
            type : 'SUBCATEGORY_NAME'
        },
        CITY_NAME: {
            statusCode:400,
            customMessage : 'City name you have entered is already exist.',
            type : 'CITY_NAME'
        },
        ROOM_NAME: {
            statusCode:400,
            customMessage : 'Room name you have entered is already exist.',
            type : 'ROOM_NAME'
        },
        STYLE_NAME: {
            statusCode:400,
            customMessage : 'Style name you have entered is already exist.',
            type : 'STYLE_NAME'
        },
        BRAND_NAME: {
            statusCode:400,
            customMessage : 'Brand name you have entered is already exist.',
            type : 'BRAND_NAME'
        },
        COLOR_NAME: {
            statusCode:400,
            customMessage : 'The colour you have entered already exists.',
            type : 'COLOR_NAME'
        },
        SIZE_NAME: {
            statusCode:400,
            customMessage : 'Size you have entered is already exist.',
            type : 'SIZE_NAME'
        },
        COUNTRY_NAME: {
            statusCode:400,
            customMessage : 'Country name you have entered is already exist.',
            type : 'COUNTRY_NAME'
        },
        NOT_REGISTER: {
            statusCode:400,
            customMessage : 'You are not registered with us.kindly signup first.',
            type : 'NOT_REGISTER'
        },
        DUPLICATE_EMAIL: {
            statusCode:400,
            customMessage : 'Duplicate email entered',
            type : 'DUPLICATE_EMAIL'
        },
        INVALID_CODE: {
            statusCode:400,
            customMessage : 'OTP you have entered does not match.',
            type : 'INVALID_CODE'
        },

},
    SUCCESS : {
        CREATED: {
            statusCode:200,
            customMessage : 'Created Successfully',
            type : 'CREATED'
        },
        DEFAULT: {
            statusCode:200,
            customMessage : 'Success',
            type : 'DEFAULT'
        },
        UPDATED: {
            statusCode:200,
            customMessage : 'Updated Successfully',
            type : 'UPDATED'
        },
        LOGOUT: {
            statusCode:200,
            customMessage : 'Logged Out Successfully',
            type : 'LOGOUT'
        },
        DELETED: {
            statusCode:200,
            customMessage : 'Deleted Successfully',
            type : 'DELETED'
        },
        REGISTER: {
            statusCode:200,
            customMessage : 'Register Successfully',
            type : 'REGISTER'
        },
    }
};

const swaggerDefaultResponseMessages = {
    '200': {'description': 'Success'},
    '400': {'description': 'Bad Request'},
    '401': {'description': 'Unauthorized'},
    '404': {'description': 'Data Not Found'},
    '500': {'description': 'Internal Server Error'}
};

let APP_CONSTANTS = {
    SERVER: SERVER,
    DATABASE: DATABASE,
    STATUS_MSG: STATUS_MSG,
    swaggerDefaultResponseMessages: swaggerDefaultResponseMessages,
};

module.exports = APP_CONSTANTS;
