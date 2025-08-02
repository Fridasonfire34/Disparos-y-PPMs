import { Suspense } from 'react';
import SequencesClient from './SequencesClient';

export default function SequencesPage() {
  return (
    <Suspense fallback={<div>Cargando página...</div>}>
      <SequencesClient />
    </Suspense>
  );
}
