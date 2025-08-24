import { Note } from '../../../models/Note';
import { User } from '../../../models/User';
import mongoose from 'mongoose';

describe('Note Model', () => {
  let userId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id as mongoose.Types.ObjectId;
  });

  const validNoteData = {
    title: 'Test Note',
    content: 'This is a test note content',
    tags: ['test', 'unit']
  };

  describe('Validation', () => {
    it('should create a note with valid data', async () => {
      const note = new Note({
        ...validNoteData,
        author: userId
      });
      const savedNote = await note.save();

      expect(savedNote._id).toBeDefined();
      expect(savedNote.title).toBe(validNoteData.title);
      expect(savedNote.content).toBe(validNoteData.content);
      expect(savedNote.author).toEqual(userId);
      expect(savedNote.tags).toEqual(validNoteData.tags);
      expect(savedNote.isArchived).toBe(false);
      expect(savedNote.createdAt).toBeDefined();
      expect(savedNote.updatedAt).toBeDefined();
    });

    it('should require title field', async () => {
      const note = new Note({
        content: 'This is a test note content',
        author: userId
      });

      await expect(note.save()).rejects.toThrow('Title is required');
    });

    it('should require content field', async () => {
      const note = new Note({
        title: 'Test Note',
        author: userId
      });

      await expect(note.save()).rejects.toThrow('Content is required');
    });

    it('should require author field', async () => {
      const note = new Note({
        title: 'Test Note',
        content: 'This is a test note content'
      });

      await expect(note.save()).rejects.toThrow('Author is required');
    });

    it('should limit title length', async () => {
      const note = new Note({
        title: 'a'.repeat(201),
        content: 'This is a test note content',
        author: userId
      });

      await expect(note.save()).rejects.toThrow('Title cannot exceed 200 characters');
    });

    it('should limit content length', async () => {
      const note = new Note({
        title: 'Test Note',
        content: 'a'.repeat(10001),
        author: userId
      });

      await expect(note.save()).rejects.toThrow('Content cannot exceed 10000 characters');
    });

    it('should limit tag length', async () => {
      const note = new Note({
        title: 'Test Note',
        content: 'This is a test note content',
        author: userId,
        tags: ['a'.repeat(31)]
      });

      await expect(note.save()).rejects.toThrow('Tag cannot exceed 30 characters');
    });

    it('should create note with empty tags array', async () => {
      const note = new Note({
        title: 'Test Note',
        content: 'This is a test note content',
        author: userId,
        tags: []
      });
      const savedNote = await note.save();

      expect(savedNote.tags).toEqual([]);
    });

    it('should create note without tags field', async () => {
      const note = new Note({
        title: 'Test Note',
        content: 'This is a test note content',
        author: userId
      });
      const savedNote = await note.save();

      expect(savedNote.tags).toEqual([]);
    });

    it('should default isArchived to false', async () => {
      const note = new Note({
        title: 'Test Note',
        content: 'This is a test note content',
        author: userId
      });
      const savedNote = await note.save();

      expect(savedNote.isArchived).toBe(false);
    });

    it('should allow setting isArchived to true', async () => {
      const note = new Note({
        title: 'Test Note',
        content: 'This is a test note content',
        author: userId,
        isArchived: true
      });
      const savedNote = await note.save();

      expect(savedNote.isArchived).toBe(true);
    });
  });

  describe('References', () => {
    it('should populate author reference', async () => {
      const note = new Note({
        ...validNoteData,
        author: userId
      });
      await note.save();

      const populatedNote = await Note.findById(note._id).populate('author');
      expect(populatedNote?.author).toBeDefined();
      expect((populatedNote?.author as any).email).toBe('john@example.com');
    });

    it('should validate author ObjectId', async () => {
      const note = new Note({
        ...validNoteData,
        author: 'invalid-id'
      });

      await expect(note.save()).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    it('should have compound index on author and createdAt', async () => {
      const indexes = await Note.collection.getIndexes();
      const hasAuthorCreatedAtIndex = Object.entries(indexes).some(([name, index]: [string, any]) => {
        if (name.includes('author') && name.includes('createdAt')) {
          return true;
        }
        const keys = Object.keys(index.key || index);
        return keys.includes('author') && keys.includes('createdAt');
      });
      expect(hasAuthorCreatedAtIndex).toBe(true);
    });

    it('should have compound index on author and isArchived', async () => {
      const indexes = await Note.collection.getIndexes();
      const hasAuthorArchivedIndex = Object.entries(indexes).some(([name, index]: [string, any]) => {
        if (name.includes('author') && name.includes('isArchived')) {
          return true;
        }
        const keys = Object.keys(index.key || index);
        return keys.includes('author') && keys.includes('isArchived');
      });
      expect(hasAuthorArchivedIndex).toBe(true);
    });

    it('should have tags index', async () => {
      const indexes = await Note.collection.getIndexes();
      const hasTagsIndex = Object.entries(indexes).some(([name, index]: [string, any]) => {
        if (name.includes('tags')) {
          return true;
        }
        const keys = Object.keys(index.key || index);
        return keys.includes('tags');
      });
      expect(hasTagsIndex).toBe(true);
    });
  });

  describe('Text search', () => {
    it('should support text search on title and content', async () => {
      const note1 = new Note({
        title: 'JavaScript Tutorial',
        content: 'Learn how to use JavaScript effectively',
        author: userId
      });
      await note1.save();

      const note2 = new Note({
        title: 'Python Guide',
        content: 'A comprehensive guide to Python programming',
        author: userId
      });
      await note2.save();

      const searchResults = await Note.find({ $text: { $search: 'JavaScript' } });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('JavaScript Tutorial');
    });
  });
});