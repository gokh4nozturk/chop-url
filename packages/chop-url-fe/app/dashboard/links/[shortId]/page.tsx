'use client';

import LoadingSpinner from '@/components/custom/loading-spinner';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LinkDetailsPage() {
  const { shortId } = useParams();
  const { urlDetails, isLoading, getUrlDetails } = useUrlStore();

  useEffect(() => {
    if (shortId) {
      getUrlDetails(shortId as string);
    }
  }, [shortId, getUrlDetails]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <LinkDetails urlDetails={urlDetails} />;
}

const LinkDetails = ({ urlDetails }: { urlDetails: IUrl | null }) => {
  return (
    <div>
      <h1>{urlDetails?.originalUrl}</h1>
      <p>{urlDetails?.shortUrl}</p>
      <p>{urlDetails?.visitCount}</p>
    </div>
  );
};
