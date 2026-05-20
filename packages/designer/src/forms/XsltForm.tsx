import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function XsltForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Stylesheet path</label>
        <input {...register('stylesheetPath', { required: 'Required' })} placeholder="classpath:transform.xsl" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
