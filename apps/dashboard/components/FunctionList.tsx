"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getFunctionList } from "@/app/lib/api";

export function FunctionList() {
  const [functions, setFunctions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFunctions = async () => {
      setIsLoading(true);
      const data = await getFunctionList();
      setFunctions(data);
      setIsLoading(false);
    };

    fetchFunctions();
  }, []);

  if (isLoading) {
    return <Skeleton className="w-[300px] h-10" />;
  }

  return (
    <>
      <Select>
        <SelectTrigger className="w-[300px] font-mono">
          <SelectValue placeholder="Select a function" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Functions</SelectLabel>
            {functions.map((f) => (
              <SelectItem className="font-mono" key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
