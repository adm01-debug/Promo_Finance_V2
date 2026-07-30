import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getEntidadeListInfo } from "@/lib/anomalia-routes";

interface Props {
  entidadeTipo: string | null | undefined;
  /** Optional click handler — used by the drawer to close itself on navigate. */
  onNavigate?: () => void;
}

/**
 * Breadcrumb: Insights IA › [Lista da entidade] › Anomalia.
 * Shown on both the full drill-down page and the side drawer so the user
 * can jump back to the filtered list of the related entity in one click.
 */
export function AnomaliaBreadcrumb({ entidadeTipo, onNavigate }: Props) {
  const lista = getEntidadeListInfo(entidadeTipo);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin/insights-ia" onClick={onNavigate}>
              Insights IA
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {lista && (
          <>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={lista.url} onClick={onNavigate}>
                  {lista.label}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator>
          <ChevronRight />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Anomalia</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
