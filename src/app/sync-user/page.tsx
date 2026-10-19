import { auth, clerkClient, EmailAddress } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation';
import { db } from '~/server/db';


const SyncUser = async () => {
    const {userId} = await auth();
    if (!userId) {
        throw new Error('No user ID found');
    }
    const client= await clerkClient();
    const user = await client.users.getUser(userId);

    if(!user.emailAddresses[0]?.emailAddress){
        return notFound();
    }

    await db.user.upsert({
        where:{
            EmailAddress: user.emailAddresses[0]?.emailAddress ?? ""
        },
        update:{
            imageUrl: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName,
        },
        create:{
            id: userId,
            EmailAddress: user.emailAddresses[0]?.emailAddress ?? "",
            imageUrl: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName,
        }
})

    return redirect('/dashboard')
}

export default SyncUser