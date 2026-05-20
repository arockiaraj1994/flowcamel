import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function HttpEndpointForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Port</label>
        <input type="number" {...register('port', { required: 'Required' })} placeholder="8080" />
      </div>
      <div className="fc-field">
        <label>Path</label>
        <input {...register('path', { required: 'Required' })} placeholder="/webhook" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
