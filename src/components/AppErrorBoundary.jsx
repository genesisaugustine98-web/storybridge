import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Last line of defence: an unexpected render exception shows a readable screen
 * instead of the blank black page a crashed React tree would otherwise leave.
 * When nothing is wrong it renders its children untouched.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Console only: no error text is sent anywhere off the device.
    console.error('StoryBridge could not render a page:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-14">
        <div className="w-full max-w-lg">
          <div className="card-soft p-7 sm:p-9">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </span>
              <div className="min-w-0">
                <p className="label-caps text-accent">StoryBridge</p>
                <h1 className="mt-2 font-heading text-[26px] leading-tight sm:text-[30px]">
                  Something broke while drawing this page.
                </h1>
              </div>
            </div>

            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
              This is a fault in the app interface, not anything you did. Your brief and lesson live only in this
              browser tab, so reloading starts a fresh session — nothing was sent anywhere.
            </p>

            {error && error.message ? (
              <p className="mt-4 break-words rounded-xl border border-border/80 bg-muted/60 px-3.5 py-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                {error.message}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4" /> Reload StoryBridge
              </button>
              <a
                href="/methodology"
                className="text-[12.5px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                About &amp; methodology
              </a>
            </div>
          </div>

          <p className="mt-4 text-center text-[11.5px] text-muted-foreground">
            If it keeps happening, note what you were doing when it broke.
          </p>
        </div>
      </div>
    );
  }
}