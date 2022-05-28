import { Schema, model, FilterQuery, Document } from 'mongoose';

export interface UserGroup {
    title: string;
    users: string[]
}

export interface LookingForGroupData {
    identifier: string;
    name?: string;
    description?: string;
    hosts?: string[];
    userGroups: UserGroup[];
}

export interface LFGRawData extends LookingForGroupData, Document {}

export const LFGSchema = model('discord-mafia-lfg', new Schema({
    identifier: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: false,
        default: "Looking For Group"
    },
    description: {
        type: String,
        required: false,
        default: 'Click on the appropriate buttons to join a group.'
    },
    hosts: {
        type: [String],
        required: false,
        default: []
    },
    userGroups: {
        type: [new Schema({
            title: {
                type: String,
                required: true
            },
            users: {
                type: [String],
                required: false,
                default: []
            }
        })]
    }
}));

export const getLFGData = async (query: FilterQuery<any>) => {
    return await LFGSchema.findOne(query)
}

export const createLFGData = async (data: LookingForGroupData) => {
    
}