'use client';

import { ErrorState, IUrlError } from '@/components/link-details/error-state';
import { LinkDetails } from '@/components/link-details/link-details';
import { LoadingState } from '@/components/link-details/loading-state';
import useUrlStore from '@/lib/store/url';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LinkDetailsPage() {
  const { shortId } = useParams();
  const { urlDetails, isLoading, error, getUrlDetails } = useUrlStore();

  useEffect(() => {
    if (shortId) {
      getUrlDetails(shortId as string);
    }
  }, [shortId, getUrlDetails]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!urlDetails) {
    return (
      <ErrorState
        error={{ code: 'NOT_FOUND', message: 'URL details not found' }}
      />
    );
  }

  return <LinkDetails urlDetails={urlDetails} />;
}
