import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function FileWatcherForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Directory</label>
        <input {...register('directory', { required: 'Required' })} placeholder="/data/incoming" />
      </div>
      <div className="fc-field">
        <label>File pattern</label>
        <input {...register('include')} placeholder=".*\.xml" />
      </div>
      <div className="fc-field">
        <label>Poll delay (ms)</label>
        <input type="number" {...register('delay')} placeholder="3000" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
