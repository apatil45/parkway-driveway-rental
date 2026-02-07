import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { favoriteDrivewaySchema, type FavoriteDrivewayInput } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

export const dynamic ='force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest){
    try{
        const authResult = await requireAuth(req);
        if(!authResult.success){
            return authResult.error!;

        }
        const userId = authResult.userId!;

        //query
        const data = await prisma.favorite.findMany({
            where: { userId: userId},
            include:{
                driveway:{
                    include:{
                        owner:{select:{id: true,name: true, avatar: true} },
                        reviews:{select:{rating: true }}
                    }
                }
            },
            orderBy:{ createdAt: 'desc' }
            
        })

        return NextResponse.json(
            createApiResponse(data, 'Favorites retrieved successfully')

        );
        
    }
    catch(error){
        logger.error('Get favorites error', {}, error instanceof Error ? error: undefined);
        return NextResponse.json(
            createApiError('Unable to load favorites', 500, 'INTERNAL_ERROR'),
            {status: 500}

        ); 
    }

}


export async function POST(req: NextRequest){

    try{

    const authResult = await requireAuth(req);
    if (!authResult.success) {
      return authResult.error!;
    }
    const userId = authResult.userId!;

    const body = await req.json();

    const validationResult = favoriteDrivewaySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createApiError(
          'Validation failed: ' + validationResult.error.errors.map(e => e.message).join(', '),
          400,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }


    const{drivewayId}: FavoriteDrivewayInput = validationResult.data;

    const driveway = await prisma.driveway.findUnique({
        where: {id: drivewayId}
    });

    if(!driveway){
        return NextResponse.json(
            createApiError('Driveway not found', 404, 'NOT_FOUND'),
            {status: 404}
        );
    }

    const existingFavorite = await prisma.favorite.findUnique({
        where: {userId_drivewayId: {userId: userId, drivewayId: drivewayId}}
    });
    if(existingFavorite){
        return NextResponse.json(
            createApiError('This is already your favorite driveway',400,'ALREADY_FAVORITED'),
            {status: 400}
        );
        }

    const favorite = await prisma.favorite.create({
        data: {
            userId: userId, drivewayId: drivewayId
        },
        include:{
            driveway:{
                include:{
                    owner: { select:{id: true, name: true, avatar: true}}

                }
            }
        }
    });

    return NextResponse.json(
        createApiResponse(favorite, 'Driveway added to favorites',201),
        {status: 201}
    );


    }

    catch(error: any){
        if(error.code === 'P2002'){
            return NextResponse.json(
                createApiError('This driveway is already in your favorites', 400,'ALREADY_FAVORITED'),
                {status: 400}
            );

        }
        logger.error('Create favorite error',{}, error instanceof Error ? error: undefined);
        return NextResponse.json(
            createApiError('Unable to add favorite', 500, 'INTERNAL_ERROR'),
            {status: 500}
                
        );

    }
}




