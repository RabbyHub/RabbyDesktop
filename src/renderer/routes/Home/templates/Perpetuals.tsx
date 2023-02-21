import React, { useMemo } from 'react';
import { PortfolioItem } from '@debank/rabby-api/dist/types';
import { formatNumber } from '@/renderer/utils/number';
import { Table } from '../components/Table';
import Panel from '../components/Panel';
import * as Value from '../components/Value';

export default React.memo((props: { data: PortfolioItem[] }) => {
  const data: any = props.data;
  const hasDescription = data.some((v: any) => !!v.detail.description);

  const headers = useMemo(() => {
    const _headers = [
      'Currency Pair',
      'Side',
      'Entry Price',
      'Mark Price',
      'Liquidation Price',
      'Position',
    ];
    if (hasDescription) {
      _headers.unshift('');
    }

    return _headers;
  }, [hasDescription]);

  return data.map((p: any) => (
    <Panel>
      <Table>
        <Table.Header headers={headers} />
        <Table.Body>
          <Table.Row>
            {hasDescription && <Value.String value={p.detail.description} />}
            <Value.TokensSlash
              value={[p.detail.base_token, p.detail.quote_token]}
            />
            <Value.String value={p.detail.side} />
            <Value.NumberWithCommas value={p.detail.entry_price} />
            <Value.NumberWithCommas value={p.detail.mark_price} />
            {p.detail.liquidation_price ? (
              <Value.NumberWithCommas value={p.detail.liquidation_price} />
            ) : (
              <Value.String value="-" />
            )}
            <Value.Balance value={p.detail.position_token} />
          </Table.Row>
        </Table.Body>
      </Table>

      <Table>
        <Table.Header
          headers={[
            'Margin',
            'Margin Rate',
            'Leverage',
            '24h Funding',
            'USD Value',
          ]}
        />
        <Table.Body>
          <Table.Row>
            <Value.Balance value={p.detail.margin_token} />
            <Value.Percent value={p.detail.margin_rate} />
            <Value.String value={`${formatNumber(p.detail.leverage)} ×`} />
            <Value.Percent value={p.detail.daily_funding_rate} />
            <Value.USDValue value={p.stats.net_usd_value} />
          </Table.Row>
        </Table.Body>
      </Table>
    </Panel>
  ));
});
