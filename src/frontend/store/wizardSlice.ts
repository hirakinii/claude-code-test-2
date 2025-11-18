import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SchemaWithStructure } from '@common/entities';
import type { FieldValue } from '../types/dto';

interface WizardState {
  specificationId: string | null;
  schema: SchemaWithStructure | null;
  data: Record<string, FieldValue>;
  currentStep: number;
  validationErrors: Record<string, string>;
  isSaving: boolean;
}

const initialState: WizardState = {
  specificationId: null,
  schema: null,
  data: {},
  currentStep: 0,
  validationErrors: {},
  isSaving: false,
};

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    initializeWizard: (
      state,
      action: PayloadAction<{
        specificationId: string | null;
        schema: SchemaWithStructure;
        data?: Record<string, FieldValue>;
      }>
    ) => {
      state.specificationId = action.payload.specificationId;
      state.schema = action.payload.schema;
      state.data = action.payload.data || {};
      state.currentStep = 0;
      state.validationErrors = {};
    },
    updateField: (
      state,
      action: PayloadAction<{ fieldId: string; value: FieldValue }>
    ) => {
      state.data[action.payload.fieldId] = action.payload.value;
      // Clear validation error for this field
      delete state.validationErrors[action.payload.fieldId];
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setValidationErrors: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
      state.validationErrors = action.payload;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    loadFromLocalStorage: (
      state,
      action: PayloadAction<Partial<WizardState>>
    ) => {
      return { ...state, ...action.payload };
    },
    resetWizard: () => initialState,
  },
});

export const {
  initializeWizard,
  updateField,
  setCurrentStep,
  setValidationErrors,
  setSaving,
  loadFromLocalStorage,
  resetWizard,
} = wizardSlice.actions;

export default wizardSlice.reducer;
