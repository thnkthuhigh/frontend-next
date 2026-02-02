/**
 * Spacing Constants for Consistent UI
 * Use these constants throughout the application for consistent spacing
 */

export const SPACING = {
  // Header elements
  header: 'px-4 py-2',
  headerCompact: 'px-3 py-1.5',
  
  // Toolbar items
  toolbar: 'px-2 py-1.5',
  toolbarCompact: 'px-1.5 py-1',
  toolbarGroup: 'gap-2',
  toolbarGroupTight: 'gap-1',
  
  // Side panels
  panel: 'p-4',
  panelCompact: 'p-3',
  panelSection: 'space-y-4',
  panelSectionTight: 'space-y-3',
  
  // Sections
  section: 'space-y-3',
  sectionTight: 'space-y-2',
  sectionRelaxed: 'space-y-4',
  
  // Button groups
  buttonGroup: 'gap-2',
  buttonGroupTight: 'gap-1',
  buttonGroupRelaxed: 'gap-3',
  
  // Cards
  card: 'p-4',
  cardCompact: 'p-3',
  cardRelaxed: 'p-6',
  
  // Lists
  list: 'space-y-2',
  listTight: 'space-y-1',
  listRelaxed: 'space-y-3',
  
  // Forms
  formGroup: 'space-y-2',
  formInput: 'px-3 py-2',
  formLabel: 'mb-1.5',
  
  // Modal/Dialog
  modal: 'p-6',
  modalCompact: 'p-4',
  modalHeader: 'mb-4',
  modalFooter: 'mt-6',
} as const;

export type SpacingKey = keyof typeof SPACING;
