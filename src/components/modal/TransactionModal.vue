<template lang="html">
  <div
    class="transaction-modal"
    data-test="transaction-modal"
  >
    <v-modal @close="close">
      <template slot="header">
        {{ $t('components.transactionModal.header') }}
      </template>

      <div>
        <transaction-table
          :transaction="transaction"
          :currency="activeCurrency"
        />
      </div>

      <div
        slot="footer"
        class="buttons"
      >
        <a
          class="button is-primary"
          data-test="confirm-button"
          @click="confirm"
        >
          {{ $t('global.confirm') }}
        </a>
        <a
          class="button"
          @click="close"
        >
          {{ $t('global.cancel') }}
        </a>
      </div>
    </v-modal>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import TransactionTable from '@/components/TransactionTable';

export default {
  name: 'TransactionModal',
  props: {
    transaction: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapState({
      activeCurrency: state => state.web3.activeCurrency,
    }),
  },
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    close() {
      this.$emit('close');
    },
  },
  components: {
    TransactionTable,
  },
};
</script>
