import bcrypt from "bcrypt";


export const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        // gen salt with 12 rounds then use salt to hash
        bcrypt.genSalt(12, (err, salt) => {
            if(err) {
                reject(err);
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if(err) {
                    reject(err);
                }
                resolve(hash);
            })
        })
    })
};

export const comparePassword = (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};