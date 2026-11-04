import argon2 from 'argon2';

const hash = async (password: string): Promise<string> => await argon2.hash(password);

const check = async (password: string, hashedPassword: string): Promise<boolean> => await argon2.verify(hashedPassword, password);

const needsRehash = (hashedPassword: string): boolean => argon2.needsRehash(hashedPassword);

export const hasher = { hash, check, needsRehash };
