import { useForm } from 'react-hook-form';
import { FlowNode } from '@flowcamel/core';

interface Props {
  node: FlowNode;
  onSave: (props: FlowNode['props']) => void;
}

export function SftpForm({ node, onSave }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: node.props });

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="fc-field">
        <label>Host</label>
        <input {...register('host', { required: 'Required' })} placeholder="e.g. sftp.myserver.com" />
        {errors.host && <span className="fc-field__error">{errors.host.message as string}</span>}
      </div>
      <div className="fc-field">
        <label>Port</label>
        <input type="number" {...register('port', { required: 'Required' })} placeholder="22" />
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
        <label>Remote Folder</label>
        <input {...register('folder', { required: 'Required' })} placeholder="/inbox" />
      </div>
      <div className="fc-field">
        <label>Poll every (ms)</label>
        <input type="number" {...register('pollEvery')} placeholder="5000" />
      </div>
      <button type="submit" className="fc-form-save">Save</button>
    </form>
  );
}
