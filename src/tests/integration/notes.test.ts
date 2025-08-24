import { FastifyInstance } from 'fastify';
import { AppConfig } from '../../config/app';
import { authRoutes } from '../../routes/auth';
import { noteRoutes } from '../../routes/notes';
import { Note } from '../../models/Note';
import { User } from '../../models/User';

describe('Notes Integration Tests', () => {
  let app: FastifyInstance;
  let user1: any;
  let user2: any;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    // Ensure JWT_SECRET is set for tests
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRE = '1h';
    
    app = await AppConfig.createApp();
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(noteRoutes, { prefix: '/notes' });
    await app.ready();

    // Create test users
    const user1Response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123'
      }
    });
    
    if (user1Response.statusCode !== 201) {
      throw new Error(`User1 registration failed: ${user1Response.statusCode} ${user1Response.payload}`);
    }
    
    const user1Body = JSON.parse(user1Response.payload);
    user1 = user1Body.data.user;
    token1 = user1Body.data.token;

    const user2Response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123'
      }
    });
    
    if (user2Response.statusCode !== 201) {
      throw new Error(`User2 registration failed: ${user2Response.statusCode} ${user2Response.payload}`);
    }
    
    const user2Body = JSON.parse(user2Response.payload);
    user2 = user2Body.data.user;
    token2 = user2Body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /notes', () => {
    const validNoteData = {
      title: 'Test Note',
      content: 'This is a test note content',
      tags: ['test', 'unit']
    };

    it('should create a note successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: validNoteData
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Note created successfully');
      expect(body.data.note.title).toBe(validNoteData.title);
      expect(body.data.note.content).toBe(validNoteData.content);
      expect(body.data.note.tags).toEqual(validNoteData.tags);
      expect(body.data.note.isArchived).toBe(false);
      expect(body.data.note.id).toBeDefined();
    });

    it('should create note without tags', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          title: 'Note without tags',
          content: 'This note has no tags'
        }
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.payload);
      expect(body.data.note.tags).toEqual([]);
    });

    it('should filter empty tags', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          title: 'Note with empty tags',
          content: 'This note has empty tags',
          tags: ['valid', '', '   ', 'another']
        }
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.payload);
      expect(body.data.note.tags).toEqual(['valid', 'another']);
    });

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        payload: validNoteData
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for missing title', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          content: 'This is a test note content'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          title: 'Test Note'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /notes', () => {
    beforeEach(async () => {
      // Clean up existing notes only, preserve users
      await Note.deleteMany({});
      // Create test notes for user1
      const notes = [
        { title: 'Note 1', content: 'Content 1', tags: ['tag1', 'tag2'] },
        { title: 'Note 2', content: 'Content 2', tags: ['tag2', 'tag3'] },
        { title: 'Archived Note', content: 'Archived content', tags: ['archived'], isArchived: true }
      ];

      for (const noteData of notes) {
        const response = await app.inject({
          method: 'POST',
          url: '/notes',
          headers: {
            authorization: `Bearer ${token1}`
          },
          payload: noteData
        });
        if (response.statusCode !== 201) {
          throw new Error(`Note creation failed: ${response.statusCode} ${response.payload}. Token: ${token1}`);
        }
      }

      // Create a note for user2
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token2}`
        },
        payload: { title: 'User2 Note', content: 'User2 content' }
      });
      if (response.statusCode !== 201) {
        throw new Error(`User2 note creation failed: ${response.statusCode} ${response.payload}. Token: ${token2}`);
      }
    });

    it('should get user notes with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/notes?page=1&limit=2',
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.notes).toHaveLength(2);
      expect(body.data.pagination.currentPage).toBe(1);
      expect(body.data.pagination.totalNotes).toBe(3);
      expect(body.data.pagination.totalPages).toBe(2);
      expect(body.data.pagination.hasNext).toBe(true);
      expect(body.data.pagination.hasPrev).toBe(false);

      // Should only return notes for user1
      body.data.notes.forEach((note: any) => {
        expect(['Note 1', 'Note 2', 'Archived Note']).toContain(note.title);
      });
    });

    it('should filter by archived status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/notes?archived=true',
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.data.notes).toHaveLength(1);
      expect(body.data.notes[0].title).toBe('Archived Note');
      expect(body.data.notes[0].isArchived).toBe(true);
    });

    it('should filter by tags', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/notes?tags=tag2',
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.data.notes).toHaveLength(2);
      body.data.notes.forEach((note: any) => {
        expect(note.tags).toContain('tag2');
      });
    });

    it('should filter by multiple tags', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/notes?tags=tag1,tag3',
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.data.notes).toHaveLength(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/notes'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /notes/:id', () => {
    let noteId: string;

    beforeEach(async () => {
      // Clean up existing notes only, preserve users
      await Note.deleteMany({});
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          title: 'Single Note',
          content: 'Single note content',
          tags: ['single']
        }
      });
      
      if (response.statusCode !== 201) {
        throw new Error(`Note setup failed: ${response.statusCode} ${response.payload}. Token: ${token1}`);
      }
      const body = JSON.parse(response.payload);
      noteId = body.data.note.id;
    });

    it('should get single note', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.note.id).toBe(noteId);
      expect(body.data.note.title).toBe('Single Note');
      expect(body.data.note.content).toBe('Single note content');
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await app.inject({
        method: 'GET',
        url: `/notes/${fakeId}`,
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid note ID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/notes/invalid-id',
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when accessing other user note', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token2}`
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /notes/:id', () => {
    let noteId: string;

    beforeEach(async () => {
      // Clean up existing notes only, preserve users
      await Note.deleteMany({});
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          title: 'Update Note',
          content: 'Original content',
          tags: ['original']
        }
      });
      
      if (response.statusCode !== 201) {
        throw new Error(`Note setup failed: ${response.statusCode} ${response.payload}. Token: ${token1}`);
      }
      const body = JSON.parse(response.payload);
      noteId = body.data.note.id;
    });

    it('should update note successfully', async () => {
      const updates = {
        title: 'Updated Note',
        content: 'Updated content',
        tags: ['updated', 'modified'],
        isArchived: true
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: updates
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Note updated successfully');
      expect(body.data.note.title).toBe(updates.title);
      expect(body.data.note.content).toBe(updates.content);
      expect(body.data.note.tags).toEqual(updates.tags);
      expect(body.data.note.isArchived).toBe(true);
    });

    it('should update partial note fields', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          title: 'Partially Updated'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.data.note.title).toBe('Partially Updated');
      expect(body.data.note.content).toBe('Original content'); // Should remain unchanged
    });

    it('should filter empty tags during update', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          tags: ['valid', '', '   ', 'another']
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.data.note.tags).toEqual(['valid', 'another']);
    });

    it('should return 400 for empty update payload', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.payload);
      expect(body.message).toBe('No updates provided');
    });

    it('should return 404 when updating other user note', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token2}`
        },
        payload: {
          title: 'Hacked Update'
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /notes/:id', () => {
    let noteId: string;

    beforeEach(async () => {
      // Clean up existing notes only, preserve users
      await Note.deleteMany({});
      const response = await app.inject({
        method: 'POST',
        url: '/notes',
        headers: {
          authorization: `Bearer ${token1}`
        },
        payload: {
          title: 'Delete Note',
          content: 'To be deleted',
          tags: ['delete']
        }
      });
      
      if (response.statusCode !== 201) {
        throw new Error(`Note setup failed: ${response.statusCode} ${response.payload}. Token: ${token1}`);
      }
      const body = JSON.parse(response.payload);
      noteId = body.data.note.id;
    });

    it('should delete note successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Note deleted successfully');

      // Verify note is actually deleted
      const note = await Note.findById(noteId);
      expect(note).toBeNull();
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await app.inject({
        method: 'DELETE',
        url: `/notes/${fakeId}`,
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid note ID format', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/notes/invalid-id',
        headers: {
          authorization: `Bearer ${token1}`
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when deleting other user note', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/notes/${noteId}`,
        headers: {
          authorization: `Bearer ${token2}`
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });
});