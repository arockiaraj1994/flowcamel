import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props { node: FlowNode; onSave: (props: FlowNode['props']) => void; }

export function SendEmailForm({ node, onSave }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: node.props });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>SMTP host</label>
        <input {...register('host', { required: 'Required' })} placeholder="smtp.gmail.com" />
      </div>
      <div className="fc-field">
        <label>SMTP port</label>
        <input type="number" {...register('port')} placeholder="587" />
      </div>
      <div className="fc-field">
        <label>Username</label>
        <input {...register('username', { required: 'Required' })} />
      </div>
      <div className="fc-field">
        <label>Password</label>
        <input type="password" {...register('password', { required: 'Required' })} />
      </div>
      <div className="fc-field">
        <label>To</label>
        <input {...register('to', { required: 'Required' })} placeholder="recipient@example.com" />
      </div>
      <div className="fc-field">
        <label>Subject</label>
        <input {...register('subject', { required: 'Required' })} placeholder="Notification" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
