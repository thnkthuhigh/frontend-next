import { migrateToStructuredDocument } from '../document-migration';
import { DocumentState } from '../../store/document-store';
import { DocumentStructure } from '../../types/document-structure';

jest.mock('../store/document-store', () => ({
  useDocumentStore: jest.fn()
}));

describe('migrateToStructuredDocument', () => {
  it('should migrate a flat document to structured format', () => {
    const oldDoc: DocumentState = {
      title: 'Test Document',
      subtitle: 'Subtitle',
      author: 'John Doe',
      date: '2023-01-01',
      jsonContent: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Abstract' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'This is the abstract.' }] },
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'References' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Reference 1' }] }
        ]
      },
      selectedStyle: 'professional',
      outputFormat: 'docx',
      isProcessing: false,
      rawContent: '',
      htmlContent: '',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      marginPreset: 'normal'
    };

    const newDoc = migrateToStructuredDocument(oldDoc);
    expect(newDoc.structure).toBeDefined();
    expect(newDoc.structure?.frontMatter).toBeDefined();
    expect(newDoc.structure?.mainContent).toBeDefined();
    expect(newDoc.structure?.backMatter).toBeDefined();
    expect(newDoc.structure?.sectionMarkers).toBeDefined();
  });

  it('should handle empty document content', () => {
    const oldDoc: DocumentState = {
      title: 'Empty Document',
      author: 'Jane Smith',
      jsonContent: {
        type: 'doc',
        content: []
      },
      // other required fields
      selectedStyle: 'professional',
      outputFormat: 'docx',
      isProcessing: false,
      rawContent: '',
      htmlContent: '',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      marginPreset: 'normal',
      subtitle: '',
      date: new Date().toISOString().split('T')[0]
    };

    const newDoc = migrateToStructuredDocument(oldDoc);
    expect(newDoc.structure?.mainContent.content).toEqual([]);
    expect(newDoc.structure?.backMatter.references).toEqual([]);
  });

  it('should detect references section correctly', () => {
    const oldDoc: DocumentState = {
      title: 'Test with References',
      author: 'Test Author',
      jsonContent: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Introduction' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Some content' }] },
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'References' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Reference 1' }] }
        ]
      },
      selectedStyle: 'professional',
      outputFormat: 'docx',
      isProcessing: false,
      rawContent: '',
      htmlContent: '',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      marginPreset: 'normal',
      subtitle: '',
      date: new Date().toISOString().split('T')[0]
    };

    const newDoc = migrateToStructuredDocument(oldDoc);
    expect(newDoc.structure?.backMatter.references).toBeDefined();
    expect(newDoc.structure?.mainContent.content.length).toBe(2); // Introduction and content
  });
});