import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  userName: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters'
    }),
  
  agreed: Joi.boolean()
    .truthy('true', 'yes', '1')
    .falsy('false', 'no', '0'),
  
  about: Joi.string()
    .max(500)
    .allow('', null),
  
  profilePicture: Joi.string()
    .uri()
    .allow('', null),
  
  skills: Joi.array()
    .items(Joi.string().max(50))
    .max(20),
  
  socialLinks: Joi.object({
    twitter: Joi.string().uri().allow('', null),
    linkedin: Joi.string().uri().allow('', null),
    github: Joi.string().uri().allow('', null),
    portfolio: Joi.string().uri().allow('', null)
  })
}).min(1); // At least one field should be provided

export const validateProfileUpdate = (data) => {
  return updateProfileSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};