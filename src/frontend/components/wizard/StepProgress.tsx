import { Box, Stepper, Step, StepLabel } from '@mui/material';

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={currentStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
