import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function FilterForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Condition</label>
        <input {...register('expression', { required: 'Required' })} placeholder="${header.status} == 'active'" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
