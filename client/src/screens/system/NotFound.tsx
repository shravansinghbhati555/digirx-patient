import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Screen } from '../../components/ui/Layout';
import { ErrorState } from '../../components/ui/States';

export function NotFound() {
  return (
    <Screen>
      <ErrorState title="We couldn't find that" body="The link may be old, or the record was removed by the clinic. Your other records are safe." retryTo="/" />
    </Screen>
  );
}

/** Router-level error boundary. */
export function RouteError() {
  const err = useRouteError();
  if (isRouteErrorResponse(err) && err.status === 404) return <NotFound />;
  return (
    <div className="min-h-dvh bg-screen">
      <Screen>
        <ErrorState
          title="Something went wrong"
          body="This screen hit a problem. Your records are safe — try again, or contact support if it keeps happening."
          onRetry={() => window.location.reload()}
        />
      </Screen>
    </div>
  );
}
