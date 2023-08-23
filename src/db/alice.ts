import db from ".";

export function getAliceUserById(userId: string): any {
    return db.prepare('SELECT * FROM alice_users WHERE `userId` = ?').get(userId);
}

export function createAliceUserById(userId: string): void {
    db.prepare('INSERT INTO alice_users (`userId`) VALUES (?)').run(userId)
}