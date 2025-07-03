const slugify = require('slugify');

const generateSlug = string => {
    if (!string) {
        return '';
    }
    return slugify(string, {
        lower: true,
        trim: true
    });
};

module.exports = generateSlug;
