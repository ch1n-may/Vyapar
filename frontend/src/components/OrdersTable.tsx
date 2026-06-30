import { useState } from 'react';

interface Order {
  id: string;
  platform: 'Amazon' | 'Flipkart' | 'Meesho';
  product: string;
  amount: string;
  status: 'Delivered' | 'In Transit' | 'Processing' | 'RTO Risk' | 'Returned';
}

export default function OrdersTable() {
  const [orders] = useState<Order[]>([
    { id: 'AMZ-9382', platform: 'Amazon', product: 'Silk Kurti - Indigo Blue (M)', amount: '₹1,450', status: 'RTO Risk' },
    { id: 'FK-3829', platform: 'Flipkart', product: 'Cotton Jhumka Set (Gold)', amount: '₹350', status: 'Returned' },
    { id: 'MSH-1102', platform: 'Meesho', product: 'Designer Lehengha Choli', amount: '₹4,200', status: 'Delivered' },
    { id: 'AMZ-4751', platform: 'Amazon', product: 'Leather Handbag - Tan', amount: '₹2,100', status: 'In Transit' },
    { id: 'FK-9932', platform: 'Flipkart', product: 'Chiffon Saree - Pink Blush', amount: '₹950', status: 'Processing' },
    { id: 'MSH-8842', platform: 'Meesho', product: 'Jaipuri Print Bedsheet Double', amount: '₹1,150', status: 'Delivered' },
    { id: 'AMZ-8831', platform: 'Amazon', product: 'Casual Kurta Men (L)', amount: '₹890', status: 'Processing' }
  ]);

  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'Amazon':
        return { text: 'text-brand-amz', dot: 'bg-brand-amz' };
      case 'Flipkart':
        return { text: 'text-brand-flipkart', dot: 'bg-brand-flipkart' };
      default:
        return { text: 'text-brand-meesho', dot: 'bg-brand-meesho' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-semantic-green/10 text-semantic-green border border-semantic-green/20';
      case 'RTO Risk':
      case 'Returned':
        return 'bg-semantic-red/10 text-semantic-red border border-semantic-red/20';
      case 'In Transit':
        return 'bg-semantic-blue/10 text-semantic-blue border border-semantic-blue/20';
      default:
        return 'bg-semantic-amber/10 text-semantic-amber border border-semantic-amber/20';
    }
  };

  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-[12px] uppercase font-bold text-text-pri text-stroke-xs tracking-wider">
          Haal hi ke Orders (Recent Orders)
        </h2>
        <span className="text-[10px] text-text-mut hover:underline cursor-pointer">View all ➔</span>
      </div>

      <div className="bg-card rounded-lg overflow-hidden border border-border-theme">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-border-theme text-[10px] text-text-mut uppercase font-semibold">
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Platform</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/40 text-[12px]">
              {orders.map((order) => {
                const platStyle = getPlatformStyle(order.platform);
                return (
                  <tr key={order.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-text-sec">
                      {order.id}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${platStyle.dot}`}></span>
                        <span className={`${platStyle.text} text-[11px]`}>{order.platform}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-text-pri font-medium truncate max-w-[180px]">
                      {order.product}
                    </td>
                    <td className="py-2.5 px-4 text-right text-text-pri font-bold text-stroke-xs">
                      {order.amount}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold leading-none ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
