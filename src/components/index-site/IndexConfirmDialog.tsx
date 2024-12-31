import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "../ui/checkbox";

function AllowBackwardLinksTooltip({
  allowBackwardLinks,
  setAllowBackwardLinks,
}: {
  allowBackwardLinks: boolean;
  setAllowBackwardLinks: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allowBackwardLinks || false}
              onCheckedChange={(c) =>
                setAllowBackwardLinks(c === true ? true : false)
              }
              id="children-only"
            />
            <label
              htmlFor="children-only"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Allow Backward Links
            </label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-pretty max-w-80">
            Allowing backward links will allow the web scraper to crawl the
            entire site, rather than the current page and its children. Use this
            with caution.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ClearExistingDocumentsTooltip({
  clearExisting,
  setClearExisting,
}: {
  clearExisting: boolean;
  setClearExisting: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={clearExisting || false}
              onCheckedChange={(c) =>
                setClearExisting(c === true ? true : false)
              }
              id="children-only"
            />
            <label
              htmlFor="children-only"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Clear Existing Documents
            </label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-pretty max-w-80">
            If checked, it will search & delete all existing documents with a
            matching URL. This ensures that only new documents are ingested.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface IndexConfirmDialogProps {
  disabled: boolean;
  handleSubmit: (
    mode: "scrape" | "crawl",
    options?: { allowBackwardLinks?: boolean; clearExisting?: boolean },
  ) => Promise<void>;
}

export function IndexSiteConfirmDialog({
  disabled,
  handleSubmit,
}: IndexConfirmDialogProps) {
  const [allowBackwardLinks, setAllowBackwardLinks] = React.useState(false);
  const [clearExisting, setClearExisting] = React.useState(true);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          Index Site
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-3">
            <p>This action will crawl and index the current site.</p>
            <p>
              By default, the crawler will only crawl the current page and its
              children. To crawl the <i>entire site</i>, check{" "}
              <span className="text-xs font-mono">Allow Backward Links</span>.
            </p>
            <AllowBackwardLinksTooltip
              allowBackwardLinks={allowBackwardLinks}
              setAllowBackwardLinks={setAllowBackwardLinks}
            />
            <ClearExistingDocumentsTooltip
              clearExisting={clearExisting}
              setClearExisting={setClearExisting}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              handleSubmit("crawl", { allowBackwardLinks, clearExisting })
            }
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function IndexPageConfirmDialog({
  disabled,
  handleSubmit,
}: IndexConfirmDialogProps) {
  const [clearExisting, setClearExisting] = React.useState(true);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          Index Page
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogDescription className="flex flex-col gap-3">
            <p>This action will scrape and index the current page.</p>
            <ClearExistingDocumentsTooltip
              clearExisting={clearExisting}
              setClearExisting={setClearExisting}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleSubmit("scrape", { clearExisting })}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
