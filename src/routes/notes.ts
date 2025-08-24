import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Note, INote } from '../models/Note';
import { authMiddleware } from '../middleware/auth';
import mongoose from 'mongoose';

interface CreateNoteBody {
  title: string;
  content: string;
  tags?: string[];
}

interface UpdateNoteBody {
  title?: string;
  content?: string;
  tags?: string[];
  isArchived?: boolean;
}

interface NoteParams {
  id: string;
}

interface NotesQuery {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
  archived?: boolean;
}

const createNoteSchema = {
  tags: ['Notes'],
  summary: 'Create a new note',
  description: 'Create a new note with title, content, and optional tags. Requires authentication.',
  body: {
    type: 'object',
    required: ['title', 'content'],
    properties: {
      title: { 
        type: 'string', 
        maxLength: 200,
        description: 'Note title'
      },
      content: { 
        type: 'string', 
        maxLength: 10000,
        description: 'Note content'
      },
      tags: { 
        type: 'array',
        items: { type: 'string', maxLength: 30 },
        description: 'Note tags'
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            note: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                isArchived: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const updateNoteSchema = {
  tags: ['Notes'],
  summary: 'Update note',
  description: 'Update an existing note by ID. User can only update their own notes.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Note ID' }
    }
  },
  body: {
    type: 'object',
    properties: {
      title: { 
        type: 'string', 
        maxLength: 200,
        description: 'Note title'
      },
      content: { 
        type: 'string', 
        maxLength: 10000,
        description: 'Note content'
      },
      tags: { 
        type: 'array',
        items: { type: 'string', maxLength: 30 },
        description: 'Note tags'
      },
      isArchived: { 
        type: 'boolean',
        description: 'Archive status'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            note: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                isArchived: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const getNotesSchema = {
  tags: ['Notes'],
  summary: 'Get all user notes',
  description: 'Retrieve all notes for the authenticated user with optional filtering, searching, and pagination.',
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
      search: { type: 'string', description: 'Search in title and content' },
      tags: { type: 'string', description: 'Comma-separated tags' },
      archived: { type: 'boolean', description: 'Filter by archive status' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            notes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  isArchived: { type: 'boolean' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
                totalNotes: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const getNoteSchema = {
  tags: ['Notes'],
  summary: 'Get note by ID',
  description: 'Retrieve a specific note by its ID. User can only access their own notes.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Note ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            note: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                isArchived: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const deleteNoteSchema = {
  tags: ['Notes'],
  summary: 'Delete note',
  description: 'Permanently delete a note by ID. User can only delete their own notes.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Note ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

export async function noteRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  fastify.addHook('preHandler', authMiddleware);

  fastify.post<{ Body: CreateNoteBody }>('/', {
    schema: createNoteSchema
  }, async (request, reply) => {
    try {
      const { title, content, tags = [] } = request.body;
      const authorId = request.user.id;

      const note = new Note({
        title,
        content,
        author: authorId,
        tags: tags.filter(tag => tag.trim().length > 0)
      });

      await note.save();

      return reply.status(201).send({
        success: true,
        message: 'Note created successfully',
        data: {
          note: {
            id: note._id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            isArchived: note.isArchived,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        }
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
      }

      request.log.error(`Create note error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create note'
      });
    }
  });

  fastify.get<{ Querystring: NotesQuery }>('/', {
    schema: getNotesSchema
  }, async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        tags, 
        archived 
      } = request.query;

      const authorId = request.user.id;
      const skip = (page - 1) * limit;

      const filter: any = { author: authorId };

      if (typeof archived === 'boolean') {
        filter.isArchived = archived;
      }

      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tagArray.length > 0) {
          filter.tags = { $in: tagArray };
        }
      }

      if (search) {
        filter.$text = { $search: search };
      }

      const [notes, totalNotes] = await Promise.all([
        Note.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-author'),
        Note.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(totalNotes / limit);

      return reply.status(200).send({
        success: true,
        data: {
          notes: notes.map(note => ({
            id: note._id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            isArchived: note.isArchived,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalNotes,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      request.log.error(`Get notes error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve notes'
      });
    }
  });

  fastify.get<{ Params: NoteParams }>('/:id', {
    schema: getNoteSchema
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const authorId = request.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid note ID format'
        });
      }

      const note = await Note.findOne({ _id: id, author: authorId });

      if (!note) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: 'Note not found'
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          note: {
            id: note._id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            isArchived: note.isArchived,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        }
      });

    } catch (error) {
      request.log.error(`Get note error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve note'
      });
    }
  });

  fastify.put<{ Params: NoteParams; Body: UpdateNoteBody }>('/:id', {
    schema: updateNoteSchema
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      const authorId = request.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid note ID format'
        });
      }

      if (Object.keys(updates).length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'No updates provided'
        });
      }

      if (updates.tags) {
        updates.tags = updates.tags.filter(tag => tag.trim().length > 0);
      }

      const note = await Note.findOneAndUpdate(
        { _id: id, author: authorId },
        updates,
        { new: true, runValidators: true }
      );

      if (!note) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: 'Note not found'
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Note updated successfully',
        data: {
          note: {
            id: note._id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            isArchived: note.isArchived,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        }
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
      }

      request.log.error(`Update note error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update note'
      });
    }
  });

  fastify.delete<{ Params: NoteParams }>('/:id', {
    schema: deleteNoteSchema
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const authorId = request.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid note ID format'
        });
      }

      const note = await Note.findOneAndDelete({ _id: id, author: authorId });

      if (!note) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: 'Note not found'
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Note deleted successfully'
      });

    } catch (error) {
      request.log.error(`Delete note error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete note'
      });
    }
  });
}