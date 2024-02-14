import { GoogleUser } from "./user";

const main = async () => {
    const user = GoogleUser.getByEmail('keller18306@gmail.com');

    await user.api.calendar.addById('0590aeb69994609c9a75164bacb43d28b2585cac3679030d68fe4640e9c9d657@group.calendar.google.com')

    console.log('calendar added');
}

main()