import dynamic from 'next/dynamic';

const Bank = dynamic(() => import('@/components/Bank'), { ssr: false });

export default function BankPage() {
  return (
    <div className="grid section">
      <Bank />
    </div>
  );
}
