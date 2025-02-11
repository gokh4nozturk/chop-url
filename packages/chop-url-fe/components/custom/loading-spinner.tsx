import { Icons } from '@/components/icons';

const LoadingSpinner = () => (
  <div className="flex w-full h-[calc(100vh-theme(spacing.header))] items-center justify-center">
    <div className="text-center">
      <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
      <h2 className="mt-2 text-lg font-semibold">Loading...</h2>
    </div>
  </div>
);

export default LoadingSpinner;
