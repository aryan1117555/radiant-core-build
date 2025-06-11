
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PGFormValues } from './types';
import PGFormBasicInfo from './PGFormBasicInfo';
import PGFormImageGallery from './PGFormImageGallery';
import PGFormManagerSelect from './PGFormManagerSelect';

interface PGFormFieldsProps {
  form: UseFormReturn<PGFormValues>;
  managers: any[];
  images: string[];
  setImages: (images: string[]) => void;
  isEdit: boolean;
}

const PGFormFields: React.FC<PGFormFieldsProps> = ({
  form,
  managers,
  images,
  setImages,
  isEdit
}) => {
  return (
    <div className="space-y-6">
      <PGFormBasicInfo form={form} />
      <PGFormManagerSelect form={form} managers={managers} />
      <PGFormImageGallery 
        images={images} 
        setImages={setImages}
      />
    </div>
  );
};

export default PGFormFields;
