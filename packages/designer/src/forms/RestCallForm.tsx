import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function RestCallForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>URL</label>
        <input {...register('url', { required: 'Required' })} placeholder="https://api.example.com/resource" />
      </div>
      <div className="fc-field">
        <label>HTTP method</label>
        <select {...register('method')}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div className="fc-field">
        <label>Headers (JSON)</label>
        <input {...register('headers')} placeholder='{"Authorization": "Bearer token"}' />
      </div>
      <div className="fc-field">
        <label>Query params</label>
        <input {...register('queryParams')} placeholder="key=value&key2=value2" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
