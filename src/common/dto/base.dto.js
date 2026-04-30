import joi from 'joi';
import ApiError from '../utils/api-error.js';

export class BaseDto {
    static schema = joi.object({});

    static validate(data) {
        const { error, value } = this.schema.validate(data, { abortEarly: false, stripUnknown: true })
        if (error) {
            throw ApiError.badRequest(error.details.map(d => d.message).join(', '));
        }
        return {errors: null, value}
    }
}

export default BaseDto;